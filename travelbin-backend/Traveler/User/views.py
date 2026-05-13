from Traveler.User.models import User
from Traveler.User.serializer import UserSerializer, CustomTokenObtainSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from codename import codename

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer

def is_logged_in(request):
    if request.user.id != None:
        return True
    return False

def username_exists(username):
    username = username.lower()
    return User.objects.filter(username=username).exists()

def email_exists(email):
    email = email.lower()
    return User.objects.filter(email=email).exists()

def generate_username():
    while True:
        username = codename(separator='_')
        if not username_exists(username):
            return username
        
#---USER---
#Create a user
@api_view(['POST'])
def create_user(request):
    try:
        if email_exists(request.data['email']):
            return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if username_exists(request.data['username']):
                return Response({'message': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Invalid inputs. Make sure to have email, password, and username'}, status=status.HTTP_400_BAD_REQUEST)
    except:
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

#Get all users
@api_view(['GET'])
def get_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def google_login(request):
    try:
        token = request.data.get('token')
        if not token:
            return Response({'message': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        
        token_info = id_token.verify_oauth2_token(token, requests.Request(), "406054659039-q4n62er8fp028jb2jktv1mtaevhpinu0.apps.googleusercontent.com")
        email = token_info["email"]
        username = generate_username().strip().lower()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": username}
        )
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        access['username'] = user.username
        access['email'] = user.email
        
        return Response({
            "access": str(access),
            "refresh": str(refresh),
        }, status=status.HTTP_200_OK)

    except Exception as e:
         return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
