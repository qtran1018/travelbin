from rest_framework import serializers
from Traveler.User.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': True}}
    
    def create(self,validated_data):
        validated_data['username'] = (validated_data['username'] or "").strip().lower()
        validated_data['email'] = (validated_data['email'] or "").strip().lower()
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super(CustomTokenObtainSerializer, cls).get_token(user)

        token['username'] = (user.username or "").strip().lower()
        token['email'] = (user.email or "").strip().lower()
        return token