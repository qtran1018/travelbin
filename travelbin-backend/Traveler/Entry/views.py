import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models.functions import Coalesce
from django.db.models import Value
from datetime import date

from Traveler.Destination.models import TravelDestination
from Traveler.Entry.models import TravelEntry
from Traveler.Permission.models import Permissions
from Traveler.Destination.serializer import TravelDestinationSerializer
from Traveler.Entry.serializer import TravelEntrySerializer
import Traveler.Permission.views as permission

logger = logging.getLogger("Traveler")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_travel_entry(request, pk):
    try:
        destination = TravelDestination.objects.get(pk=pk)
    except TravelDestination.DoesNotExist:
        return Response({'message': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.user.id
    destination_id = str(destination.pk)

    perms = Permissions.objects.filter(user=user_id, destination_id=destination_id)
    if not perms.exists():
        return Response({'message': 'You do not have permission to add this entry.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TravelEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(destination=destination)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_travel_entry_by_pk(request, pk):
    try:
        entry = TravelEntry.objects.get(pk=pk)
        serializer = TravelEntrySerializer(entry, many=False)
        return Response(serializer.data)
    except TravelEntry.DoesNotExist:
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_travel_entry_by_destination(request, destination_id):
    entry = TravelEntry.objects.filter(destination=destination_id).annotate(
        sort_date=Coalesce('date', Value(date(9999, 12, 31)))
    ).order_by('sort_date', 'sort_order')
    serializer = TravelEntrySerializer(entry, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_entries(request, destination_id):
    items = request.data
    if not isinstance(items, list):
        return Response({'message': 'Expected a list of {id, sort_order} objects.'}, status=status.HTTP_400_BAD_REQUEST)

    user_id = request.user.id
    if not permission.has_perms(user_id, destination_id):
        return Response({'message': 'You do not have permission to reorder entries.'}, status=status.HTTP_403_FORBIDDEN)

    ids = [item.get('id') for item in items if item.get('id') is not None]
    entries = {e.id: e for e in TravelEntry.objects.filter(id__in=ids, destination=destination_id)}

    to_update = []
    for item in items:
        entry = entries.get(item.get('id'))
        if entry is not None:
            entry.sort_order = item.get('sort_order', 0)
            to_update.append(entry)

    with transaction.atomic():
        TravelEntry.objects.bulk_update(to_update, ['sort_order'])

    return Response({'updated': len(to_update)}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_travel_entry(request, pk):
    try:
        obj = TravelEntry.objects.get(pk=pk)
    except TravelEntry.DoesNotExist:
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.user.id
    destination_id = obj.destination_id

    if not permission.has_perms(user_id, destination_id):
        return Response('You do not have permissions to edit this entry.', status=status.HTTP_403_FORBIDDEN)

    serializer = TravelEntrySerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def delete_travel_entry_by_pk(request, pk):
    try:
        entry = TravelEntry.objects.get(pk=pk)
    except TravelEntry.DoesNotExist:
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.user.id
    destination_id = entry.destination_id

    perms = Permissions.objects.filter(user=user_id, destination_id=destination_id)
    if not perms.exists():
        return Response({'message': 'You do not have permission to delete this entry.'}, status=status.HTTP_403_FORBIDDEN)

    entry.delete()
    return Response({'message': 'Entry deleted.'}, status=status.HTTP_200_OK)
