from django.urls import path
from Traveler.Permission.views import * 
urlpatterns = [
    path('permissions/get_by_user/<user_id>', get_permissions_by_user, name='get_permissions_by_user'),
    path('permissions/get_by_destination/<destination_id>', get_permissions_by_destination, name='get_permissions_by_destination'),
    path('permissions/add/', add_permissions_to_user, name='add_user_permissions'),
    path('permissions/delete/<destination_id>/<delete_email>/', remove_permissions, name='remove_user_permissions')
]