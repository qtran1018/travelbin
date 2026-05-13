from django.db import models
from Traveler.Destination.models import TravelDestination
from Traveler.User.models import User

class TravelEntry(models.Model):

    name = models.CharField(max_length=100)
    #types like: Food & Drink, Shopping, Activity, etc. Restrict values on backend or frontend?
    TYPE_CHOICES = [
        ('Food & Drink', 'Food & Drink'),
        ('Shopping', 'Shopping'),
        ('Activity', 'Activity'),
        ('Sightseeing', 'Sightseeing'),
        ('Other', 'Other')
    ]
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, default='Other')
    #maybe the city or specific location
    location = models.CharField(max_length=100, blank=True)
    #maybe add address eventually
    date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)

    # this is the user who added the entry. Use either username or a nickname of available
    contributor = models.ForeignKey(User, on_delete=models.SET_NULL, to_field='username', null=True, db_constraint=False)
    destination = models.ForeignKey(TravelDestination, on_delete=models.CASCADE)

    class Meta:
        db_table = "Traveler_travel_entry"