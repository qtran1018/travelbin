from django.urls import path
import Traveler.Destination.views as destination

urlpatterns = [
    path('d/add_travel/', destination.create_travel_destination, name='add_travel'),
    path('destinations/import/', destination.import_destination, name='import_destination'),
    path('u/<user_name>/',destination.get_travel_destination_by_user, name='get_travel_destination_by_user'),
    path('d/<pk>/detail/', destination.get_destination_detail, name='get_destination_detail'),
    path('d/<pk>/update/',destination.update_travel_destination,name='update_travel_destination'),
    path('d/<pk>/delete/', destination.delete_travel_destination,name='delete_travel_destination'),
    #TODO: maybe delete, probably won't be looking up all destinations
    path('', destination.get_travel_destination, name='travel_destination')
]