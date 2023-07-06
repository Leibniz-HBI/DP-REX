# Generated by Django 4.2.2 on 2023-06-21 16:55

import django.contrib.postgres.indexes
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0008_pgsql_trigram"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="entity",
            index=models.Index(
                fields=["id_persistent"], name="vran_entity_id_pers_0f2b92_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="entity",
            index=django.contrib.postgres.indexes.GistIndex(
                fields=["display_txt"], name="vran_entity_display_a10986_gist"
            ),
        ),
    ]