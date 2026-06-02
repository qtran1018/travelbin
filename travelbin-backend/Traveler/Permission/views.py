import logging

from Traveler.User.serializer import UserSerializer
from Traveler.User.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from Traveler.Destination.models import TravelDestination
from Traveler.Permission.models import Permissions
from Traveler.Destination.serializer import TravelDestinationSerializer
from Traveler.Permission.serializer import PermissionSerializer

logger = logging.getLogger("Traveler")

def create_permissions(user_id, destination_id):
    destination_permissions = Permissions(user=user_id, destination_id=destination_id)
    destination_permissions.save()

def has_perms(user_id, destination_id):
    perms = Permissions.objects.filter(user=user_id, destination_id=destination_id)
    # perms = perms.filter(destination_id=destination_id)
    
    if not perms:
        return False
    return True

def delete_perms(destination_id):
    for perm in Permissions.objects.filter(destination_id = destination_id):
        perm.delete()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_permissions_to_user(request):
    email = request.data.get('email', "").strip().lower()
    destination_id = request.data.get('destination_id')

    if not has_perms(request.user.id, destination_id):
        return Response(f'{request.user.email} does not have permission to add this.',status=status.HTTP_401_UNAUTHORIZED)
    user = User.objects.filter(email=email)
    if not user.exists():
        return Response(f'No user with email {email} exists', status=status.HTTP_400_BAD_REQUEST)
    user_id = user[0].id

    if has_perms(user_id, destination_id):
        return Response(f'User {user_id} already has perms for destination {destination_id}', status=status.HTTP_400_BAD_REQUEST)
    
    if not TravelDestination.objects.filter(id=destination_id).exists():
        return Response({'message: Destination does not exist'}, status=status.HTTP_400_BAD_REQUEST)
    create_permissions(user_id,destination_id)
    return Response('Created permissions successfully', status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_permissions_by_user(request,user_id):
    perms = Permissions.objects.filter(user=user_id)
    if not perms.exists():
        return Response(f'No permissions exist for user {user_id}', status=status.HTTP_404_NOT_FOUND)
    serializer = PermissionSerializer(perms, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_permissions_by_destination(request, destination_id):
    perms = Permissions.objects.filter(destination_id=destination_id)
    if not perms.exists():
        return Response([], status=status.HTTP_200_OK)
    result = []
    for perm in perms:
        try:
            user = User.objects.get(id=perm.user)
            result.append({
                'permission_id': perm.id,
                'user_id': perm.user,
                'username': user.username,
                'email': user.email,
            })
        except User.DoesNotExist:
            logger.warning("Permission %s references missing user id=%s", perm.id, perm.user)
    return Response(result, status=status.HTTP_200_OK)

@api_view(['DELETE', 'GET'])
@permission_classes([IsAuthenticated])
def remove_permissions(request, destination_id, delete_email):

    if not has_perms(request.user.id, destination_id):
        return Response(f'{request.user.email} does not have permission to delete this.', status=status.HTTP_403_FORBIDDEN)
    delete_email = (delete_email or "").strip().lower()
    target_user = User.objects.filter(email=delete_email).first()
    if target_user is None:
        return Response(f'No user with email {delete_email} exists', status=status.HTTP_404_NOT_FOUND)
    delete_email_id = target_user.id
    destination = TravelDestination.objects.filter(id=destination_id)
    if not destination.exists():
        return Response(f'No destination exists for id {destination_id}', status=status.HTTP_404_NOT_FOUND)
    created_by_id = destination[0].created_by.id
    if delete_email_id == created_by_id and request.user.id != created_by_id:
        return Response(f"You remove the creator's permissions", status=status.HTTP_401_UNAUTHORIZED)
    perms = Permissions.objects.filter(user=delete_email_id, destination_id=destination_id)
    if not perms.exists():
        return Response(f'No permissions exist for user {delete_email} and destination {destination_id}', status=status.HTTP_404_NOT_FOUND)
    perms.delete()
    return Response(f'Permission {destination_id} deleted for user {delete_email}', status=status.HTTP_200_OK)

 