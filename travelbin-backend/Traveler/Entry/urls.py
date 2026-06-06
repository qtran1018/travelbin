from django.urls import path
import Traveler.Entry.views as entry

urlpatterns = [
    path('d/<pk>/create_entry/', entry.create_travel_entry, name='create_travel_entry'),
    path('d/<destination_id>/reorder/', entry.reorder_entries, name='reorder_entries'),
    path('d/<destination_id>/', entry.get_travel_entry_by_destination, name='get_entries_by_destination'),
    path('<int:pk>/delete/', entry.delete_travel_entry_by_pk, name='delete_travel_entry_by_pk'),
    path('<int:pk>/update/',entry.update_travel_entry,name='update_travel_entry'),

    #TODO: maybe delete, probably won't be looking up single entries
    path('<int:pk>/', entry.get_travel_entry_by_pk, name='travel_entry_by_pk'),
]