# Generated by Django 4.2 on 2023-05-23 10:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0003_tagdefinitioncontribution_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tagdefinitioncontribution",
            name="id_existing_persistent",
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]