# Generated by Django 4.2.2 on 2023-10-13 10:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0021_ownershiprequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="contributioncandidate",
            name="error_msg",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="contributioncandidate",
            name="error_trace",
            field=models.TextField(blank=True, null=True),
        ),
    ]