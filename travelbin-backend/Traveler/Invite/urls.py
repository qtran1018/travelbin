from django.urls import path
from Traveler.Invite.views import create_invite, get_invite_info, join_via_invite

urlpatterns = [
    path('invite/create/', create_invite, name='create_invite'),
    path('invite/<uuid:token>/', get_invite_info, name='get_invite_info'),
    path('invite/<uuid:token>/join/', join_via_invite, name='join_via_invite'),
]
