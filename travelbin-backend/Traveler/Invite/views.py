from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from Traveler.Invite.models import DestinationInvite
from Traveler.Invite.serializer import DestinationInviteSerializer
from Traveler.Permission.views import has_perms, create_permissions
from Traveler.Destination.models import TravelDestination


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invite(request):
    destination_id = request.data.get('destination_id')
    if not destination_id:
        return Response({'error': 'destination_id required'}, status=status.HTTP_400_BAD_REQUEST)

    if not has_perms(request.user.id, destination_id):
        return Response({'error': 'You do not have permission for this destination'}, status=status.HTTP_403_FORBIDDEN)

    try:
        destination = TravelDestination.objects.get(id=destination_id)
    except TravelDestination.DoesNotExist:
        return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

    invite = DestinationInvite.objects.create(
        destination=destination,
        created_by=request.user
    )
    serializer = DestinationInviteSerializer(invite)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_invite_info(request, token):
    try:
        invite = DestinationInvite.objects.select_related('destination', 'created_by').get(token=token)
    except DestinationInvite.DoesNotExist:
        return Response({'error': 'Invite not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = DestinationInviteSerializer(invite)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_via_invite(request, token):
    try:
        invite = DestinationInvite.objects.select_related('destination').get(token=token)
    except DestinationInvite.DoesNotExist:
        return Response({'error': 'Invite not found or expired'}, status=status.HTTP_404_NOT_FOUND)

    destination_id = str(invite.destination.id)
    user_id = request.user.id

    if has_perms(user_id, destination_id):
        return Response({'message': 'You already have access to this destination', 'destination_id': destination_id}, status=status.HTTP_200_OK)

    create_permissions(user_id, destination_id)
    return Response({'message': 'Joined successfully', 'destination_id': destination_id}, status=status.HTTP_201_CREATED)
