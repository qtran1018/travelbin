from django.urls import path
import Traveler.User.views as users

urlpatterns = [
    path('me/', users.me, name='me'),
    path('users/', users.get_users, name='get_users'),
]
