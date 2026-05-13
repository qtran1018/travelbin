from django.db import models

class Permissions(models.Model):
    """
    Permissions to determine who can access a given TravelDestination
    """
    # user = models.ForeignKey(User, on_delete=models.CASCADE)
    # travel_destination = models.ForeignKey(travel_destination, on_delete=models.CASCADE)
    user = models.CharField(max_length=200, default=None)
    destination_id = models.CharField(max_length=36, default=None)

    class Meta:
        db_table = "Traveler_permissions"