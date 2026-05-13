import uuid
from django.db import models
from Traveler.User.models import User

class TravelDestination(models.Model):
    """
    Destination group, i.e "Travel to Japan 2025"
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)
    #TODO: evaluate if CASCADE needs to be used. No plan to delete users yet though.
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='travel_destinations', null=True)

    def __str__(self):
        return f"Travel destination: {self.name}"
    
    class Meta:
        db_table = "Traveler_travel_destination"