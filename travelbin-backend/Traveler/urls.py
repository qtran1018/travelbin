from Traveler.User.urls import urlpatterns as USER_URLS
from Traveler.Destination.urls import urlpatterns as DESTINATION_URLS
from Traveler.Entry.urls import urlpatterns as ENTRY_URLS
from Traveler.Permission.urls import urlpatterns as PERMISSION_URLS
from Traveler.Invite.urls import urlpatterns as INVITE_URLS


urlpatterns = [*USER_URLS, *DESTINATION_URLS, *ENTRY_URLS, *PERMISSION_URLS, *INVITE_URLS]
