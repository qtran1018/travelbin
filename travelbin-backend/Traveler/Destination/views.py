
import logging
import uuid

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from Traveler.User.models import User
from Traveler.Entry.models import TravelEntry
from Traveler.Destination.models import TravelDestination
from Traveler.Permission.models import Permissions
from Traveler.Destination.serializer import TravelDestinationSerializer
import Traveler.Permission.views as permission

logger = logging.getLogger("Traveler")

VALID_ENTRY_TYPES = {'Food & Drink', 'Shopping', 'Activity', 'Sightseeing', 'Other'}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_travel_destination(request):
    user_id = request.user.id
    request.data['created_by'] = user_id
    serializer = TravelDestinationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        try:
            destination_id = uuid.UUID(serializer.data['id'])
        except (ValueError, KeyError):
            logger.error("Invalid UUID returned from serializer after save")
            return Response({'error': 'Destination created but ID is invalid.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        permission.create_permissions(user_id, destination_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_travel_destination(request):
    destinations = TravelDestination.objects.all()
    serializer = TravelDestinationSerializer(destinations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_destination_detail(request, pk):
    try:
        obj = TravelDestination.objects.get(pk=pk)
    except TravelDestination.DoesNotExist:
        return Response({'error': 'Destination not found.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = TravelDestinationSerializer(obj)
    return Response(serializer.data)


@api_view(['GET'])
def get_travel_destination_by_user(request, user_name):
    user_name = user_name.lower()
    user = User.objects.filter(username=user_name)
    if not user.exists():
        return Response({'message': 'No user found'}, status=status.HTTP_404_NOT_FOUND)
    user = user[0]
    user_id = user.id

    obj_in_perms = Permissions.objects.filter(user=user_id).values_list('destination_id', flat=True)
    uuid_list = [uuid.UUID(str(x)) for x in obj_in_perms]
    entry = TravelDestination.objects.filter(id__in=uuid_list).order_by('name')
    serializer = TravelDestinationSerializer(entry, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_travel_destination(request, pk):
    user_id = request.user.id
    destination_id = pk

    if not permission.has_perms(user_id, destination_id):
        return Response('You do not have permissions to edit this destination.', status=status.HTTP_403_FORBIDDEN)

    try:
        obj = TravelDestination.objects.get(pk=pk)
    except TravelDestination.DoesNotExist:
        return Response({'error': 'Destination not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TravelDestinationSerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_destination(request):
    """Create a destination with pre-populated entries from Itinerary-Agent."""
    name = request.data.get('name', '').strip()
    raw_entries = request.data.get('entries', [])

    if not name:
        return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

    user_id = request.user.id

    destination = TravelDestination.objects.create(
        name=name,
        created_by=request.user,
    )
    permission.create_permissions(user_id, destination.id)

    for e in raw_entries:
        entry_type = e.get('type', 'Other')
        if entry_type not in VALID_ENTRY_TYPES:
            entry_type = 'Other'
        TravelEntry.objects.create(
            destination=destination,
            name=e.get('name', 'Unnamed')[:100],
            type=entry_type,
            location=e.get('location', '')[:100],
            notes=e.get('notes', ''),
            contributor=request.user,
        )

    serializer = TravelDestinationSerializer(destination)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE', 'GET'])
@permission_classes([IsAuthenticated])
def delete_travel_destination(request, pk):
    user_id = request.user.id
    destination_id = pk

    if not permission.has_perms(user_id, destination_id):
        return Response('You do not have permissions to delete this destination.', status=status.HTTP_403_FORBIDDEN)

    try:
        obj = TravelDestination.objects.get(pk=pk)
    except TravelDestination.DoesNotExist:
        return Response({'error': 'Destination not found.'}, status=status.HTTP_404_NOT_FOUND)

    obj.delete()
    permission.delete_perms(destination_id)
    return Response('Destination deleted.', status=status.HTTP_200_OK)
