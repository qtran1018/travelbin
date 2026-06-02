from rest_framework import serializers
from Traveler.Invite.models import DestinationInvite


class DestinationInviteSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = DestinationInvite
        fields = ['token', 'destination_id', 'destination_name', 'created_by_username', 'created_at']
