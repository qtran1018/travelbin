from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from Traveler.User.serializer import UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
def get_users(request):
    from Traveler.User.models import User
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
