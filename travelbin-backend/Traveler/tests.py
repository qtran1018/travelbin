from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from Traveler.User.models import User
from Traveler.Destination.models import TravelDestination


def make_user(username="testuser", email="test@example.com"):
    return User.objects.create(username=username, email=email, keycloak_sub=f"sub-{username}")


class DestinationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_create_destination_valid(self):
        res = self.client.post("/travel/destinations/", {"name": "Tokyo"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Tokyo")

    def test_create_destination_missing_name(self):
        res = self.client.post("/travel/destinations/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_destination_unauthenticated(self):
        self.client.force_authenticate(user=None)
        res = self.client.post("/travel/destinations/", {"name": "Tokyo"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_destination_no_permission(self):
        other_user = make_user(username="other", email="other@example.com")
        destination = TravelDestination.objects.create(name="Paris", created_by=other_user)
        res = self.client.delete(f"/travel/destinations/delete/{destination.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_delete_destination_not_found(self):
        import uuid
        fake_id = uuid.uuid4()
        res = self.client.delete(f"/travel/destinations/delete/{fake_id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_update_destination_no_permission(self):
        other_user = make_user(username="other2", email="other2@example.com")
        destination = TravelDestination.objects.create(name="Berlin", created_by=other_user)
        res = self.client.patch(f"/travel/destinations/update/{destination.id}/", {"name": "Munich"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class EntryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user(username="entryuser", email="entry@example.com")
        self.client.force_authenticate(user=self.user)
        # Create a destination owned by this user
        create_res = self.client.post("/travel/destinations/", {"name": "London"}, format="json")
        self.destination_id = create_res.data["id"]

    def test_create_entry_valid(self):
        res = self.client.post(
            f"/travel/entries/create/{self.destination_id}/",
            {"name": "Big Ben", "type": "Sightseeing", "location": "Westminster", "notes": "Iconic clock tower"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_entry_destination_not_found(self):
        import uuid
        res = self.client.post(
            f"/travel/entries/create/{uuid.uuid4()}/",
            {"name": "Nowhere"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_entry_no_permission(self):
        other_user = make_user(username="noentry", email="noentry@example.com")
        destination = TravelDestination.objects.create(name="Rome", created_by=other_user)
        res = self.client.post(
            f"/travel/entries/create/{destination.id}/",
            {"name": "Colosseum"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_entry_not_found(self):
        import uuid
        res = self.client.patch(f"/travel/entries/update/{uuid.uuid4()}/", {"name": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_entry_not_found(self):
        import uuid
        res = self.client.delete(f"/travel/entries/delete/{uuid.uuid4()}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class PermissionViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user(username="permuser", email="perm@example.com")
        self.client.force_authenticate(user=self.user)
        create_res = self.client.post("/travel/destinations/", {"name": "Sydney"}, format="json")
        self.destination_id = create_res.data["id"]

    def test_add_permission_user_not_found(self):
        res = self.client.post(
            "/travel/permissions/add/",
            {"email": "nobody@nowhere.com", "destination_id": str(self.destination_id)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_permission_user_not_found(self):
        res = self.client.delete(
            f"/travel/permissions/remove/{self.destination_id}/nobody@nowhere.com/"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_remove_permission_no_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.delete(
            f"/travel/permissions/remove/{self.destination_id}/someone@example.com/"
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ImportDestinationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user(username="importuser", email="import@example.com")
        self.client.force_authenticate(user=self.user)

    def test_import_missing_name(self):
        res = self.client.post(
            "/travel/destinations/import/",
            {"entries": [{"name": "Temple", "type": "Sightseeing", "location": "Bangkok", "notes": ""}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_import_valid(self):
        res = self.client.post(
            "/travel/destinations/import/",
            {
                "name": "Bangkok Trip",
                "entries": [
                    {"name": "Wat Pho", "type": "Sightseeing", "location": "Bangkok", "notes": "Great temple"},
                    {"name": "Unknown Type", "type": "INVALID", "location": "Bangkok", "notes": ""},
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Bangkok Trip")
