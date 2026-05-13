from rest_framework import serializers
from Traveler.Permission.models import Permissions

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permissions
        fields = ['id', 'user', 'destination_id']