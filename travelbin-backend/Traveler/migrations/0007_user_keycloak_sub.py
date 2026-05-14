from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Traveler", "0006_alter_travelentry_contributor"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="keycloak_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
