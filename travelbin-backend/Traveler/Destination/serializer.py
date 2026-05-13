from rest_framework import serializers
from Traveler.Destination.models import TravelDestination

class TravelDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelDestination
        fields = ['id', 'name', 'created_by']
        read_only_fields = ['id']