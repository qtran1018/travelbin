import uuid
from django.db import models
from Traveler.User.models import User
from Traveler.Destination.models import TravelDestination


class DestinationInvite(models.Model):
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    destination = models.ForeignKey(TravelDestination, on_delete=models.CASCADE, related_name='invites')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invites')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Traveler_destination_invite"
