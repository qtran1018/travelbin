
from Traveler.User.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from Traveler.Destination.models import TravelDestination
from Traveler.Permission.models import Permissions
from Traveler.Destination.serializer import TravelDestinationSerializer
import Traveler.Permission.views as permission
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_travel_destination(request):
    user_id = request.user.id
    request.data['created_by'] = user_id
    serializer = TravelDestinationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()

        destination_id = serializer.data['id']
        destination_id = uuid.UUID(destination_id)

        permission.create_permissions(user_id, destination_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


#TODO: Delete eventually, won't be used. Get all travel destinations
@api_view(['GET'])
def get_travel_destination(request):
    destinations = TravelDestination.objects.all()
    serializer = TravelDestinationSerializer(destinations, many=True)
    return Response(serializer.data)

#Get travel destination by user. Can be used for profile page    
@api_view(['GET']) #app.com/u/ int pk but username would be better
def get_travel_destination_by_user(request,user_name):
    user_name = user_name.lower()
    user = User.objects.filter(username=user_name)
    if not user.exists():
        return Response({'message': 'No user found'}, status=status.HTTP_404_NOT_FOUND)
    user = user[0]
    user_id = user.id
    
    #TODO: destination_id should be a UUID but it is a string from the Permission model.
    # IDs are converted to UUIDs here but it's technically better to do it in the model.
    # Either make the model field a UUID or a FK to Destination, but there was some reason I didn't do it before
    obj_in_perms = Permissions.objects.filter(user=user_id).values_list('destination_id', flat=True)
    uuid_list = [uuid.UUID(str(x)) for x in obj_in_perms]
    entry = TravelDestination.objects.filter(id__in=uuid_list).order_by('name')
    serializer = TravelDestinationSerializer(entry, many=True)
    return Response(serializer.data)

#Updates travel_destination. Should only do name.
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_travel_destination(request, pk): #pk is UUID
    user_id = request.user.id
    destination_id = pk
    
    #Check if user has perms
    if permission.has_perms(user_id, destination_id):

        #Get the destination object we want to edit
        obj = TravelDestination.objects.get(pk=pk)

        #Do a partial update on the destination object.
        serializer = TravelDestinationSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response('Invalid input.',status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response('You do not have permissions to edit this destination.',status=status.HTTP_401_UNAUTHORIZED)

#Deletes destination and all associated permissions.
@api_view(['DELETE','GET'])
@permission_classes([IsAuthenticated])
def delete_travel_destination(request, pk): #pk is UUID
    user_id = request.user.id
    destination_id = pk
    if permission.has_perms(user_id, destination_id):
        obj = TravelDestination.objects.get(pk=pk)
        obj.delete()
        permission.delete_perms(destination_id)
        return Response('Destination deleted.',status=status.HTTP_200_OK)
    else:
        return Response('You do not have permissions to delete this destination.',status=status.HTTP_401_UNAUTHORIZED)
