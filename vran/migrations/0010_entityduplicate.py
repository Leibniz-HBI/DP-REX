# Generated by Django 4.2.2 on 2023-06-23 10:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0009_entity_vran_entity_id_pers_0f2b92_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="EntityDuplicate",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("id_origin_persistent", models.TextField()),
                ("id_destination_persistent", models.TextField()),
                (
                    "contribution_candidate",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="vran.contributioncandidate",
                    ),
                ),
            ],
        ),
    ]
