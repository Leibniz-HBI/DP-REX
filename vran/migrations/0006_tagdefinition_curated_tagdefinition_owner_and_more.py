# Generated by Django 4.2 on 2023-06-20 09:57

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0005_remove_tagdefinitioncontribution_id_parent_persistent_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="tagdefinition",
            name="curated",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="tagdefinition",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="MergeRequest",
            fields=[
                ("id_destination_persistent", models.TextField()),
                ("id_origin_persistent", models.TextField()),
                ("created_at", models.DateTimeField()),
                ("id_persistent", models.UUIDField(primary_key=True, serialize=False)),
                (
                    "assigned_to",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assigned_merge_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_merge_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
