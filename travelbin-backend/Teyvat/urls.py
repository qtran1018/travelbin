from django.contrib import admin
from django.urls import path, include
import Traveler.Destination.views as destination

urlpatterns = [
    path('', destination.get_travel_destination, name='anything'),
    path('admin/', admin.site.urls),
    path('travel/', include('Traveler.urls')),
]
