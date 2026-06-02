import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("Traveler", "0007_user_keycloak_sub"),
    ]

    operations = [
        migrations.CreateModel(
            name="DestinationInvite",
            fields=[
                ("token", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "destination",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invites",
                        to="Traveler.traveldestination",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_invites",
                        to="Traveler.user",
                    ),
                ),
            ],
            options={
                "db_table": "Traveler_destination_invite",
            },
        ),
    ]
