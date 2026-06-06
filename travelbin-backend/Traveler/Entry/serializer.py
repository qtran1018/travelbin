from rest_framework import serializers
from Traveler.Entry.models import TravelEntry

class TravelEntrySerializer(serializers.ModelSerializer):

    def to_internal_value(self, data):
        if data.get('date') == '':
            data['date'] = None
        return super().to_internal_value(data)

    # def get_type(self, obj):
    #     return obj.get_type_display()

    class Meta:
        model = TravelEntry
        fields = ['id', 'name', 'type', 'location', 'date', 'notes', 'sort_order', 'contributor', 'destination']
