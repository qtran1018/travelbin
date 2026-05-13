from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models.functions import Coalesce
from django.db.models import Value
from datetime import date
from Traveler.Destination.models import TravelDestination
from Traveler.Entry.models import TravelEntry
from Traveler.Permission.models import Permissions
from Traveler.Destination.serializer import TravelDestinationSerializer
from Traveler.Entry.serializer import TravelEntrySerializer
import Traveler.Permission.views as permission

#---TRAVEL ENTRY---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_travel_entry(request,pk):
    try:
        destination = TravelDestination.objects.get(pk=pk)
        destination_serializer = TravelDestinationSerializer(destination, many=False)

        #Gets IDs for permissions searching
        user_id = request.user.id
        destination_id = destination_serializer.data['id']
        
        #Filters for above IDs
        perms = Permissions.objects.filter(user=user_id, destination_id=destination_id)
        #If user-destination pair is NOT in permissions
        if not perms.exists():
            return Response({'message': 'You do not have permission to add this entry.'}, status=status.HTTP_401_UNAUTHORIZED)
        #If user-destination pair IS in permissions
        else:
            serializer = TravelEntrySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(destination=destination)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except TravelDestination.DoesNotExist:
        return Response({'message': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("Error in create_travel_entry:", e)
        return Response({'message': 'Server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#Get travel entry by primary key
#TODO: Delete eventually. Probably won't lookup specific entry by pk
@api_view(['GET'])
def get_travel_entry_by_pk(request,pk):
    try:
        entry = TravelEntry.objects.get(pk=pk)
        serializer = TravelEntrySerializer(entry, many=False)
        return Response(serializer.data)
    except Exception as e:
        print(e)
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)

#Get all travel entries by travel_destination UUID
@api_view(['GET'])
def get_travel_entry_by_destination(request,destination_id):
    try:
        #Filters by ID and then orders by date with blanks at the end.
        entry = TravelEntry.objects.filter(destination=destination_id).annotate(
            sort_date=Coalesce('date', Value(date(9999, 12, 31)))
                ).order_by('sort_date')
        serializer = TravelEntrySerializer(entry, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(e)
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_travel_entry(request, pk):
    obj = TravelEntry.objects.get(pk=pk)
    
    user_id = request.user.id
    destination_id = obj.destination_id
    #Check if user has perms
    if permission.has_perms(user_id, destination_id):

        #Do a partial update on the destination object.
        serializer = TravelEntrySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response('Invalid input.',status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response('You do not have permissions to edit this destination.',status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET','DELETE'])
@permission_classes([IsAuthenticated])
def delete_travel_entry_by_pk(request,pk):
    try:
        entry = TravelEntry.objects.get(pk=pk)
        serializer = TravelEntrySerializer(entry, many=False)

        #Gets IDs for permissions searching
        user_id = request.user.id
        destination_id = serializer.data['destination']
            
        #Filters for above IDs
        perms = Permissions.objects.filter(user=user_id)
        perms = perms.filter(destination_id=destination_id)

        #If user-destination pair is NOT in permissions
        if not perms.exists():
            return Response({'message': 'You do not have permission to delete this entry.'}, status=status.HTTP_401_UNAUTHORIZED)
        #If user-destination pair IS in permissions
        else:
            entry.delete()
            return Response({'message': 'Entry deleted.'}, status=status.HTTP_200_OK)
    except Exception as e:
        print(e)
        return Response({'message': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)

