from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import Traveler.Destination.views as destination

urlpatterns = [
    path('', destination.get_travel_destination,name='anything'),
    path('admin/', admin.site.urls),
    path('travel/', include('Traveler.urls')),
]
