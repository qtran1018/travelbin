from django.urls import path
import Traveler.User.views as users 
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView


urlpatterns = [
    path('create_user/', users.create_user, name='create_user'),
    path('users/', users.get_users, name='get_users'),
    path('api/google-login/', users.google_login, name='google-login'),
    path('api/token/', users.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]