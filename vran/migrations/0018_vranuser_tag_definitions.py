# Generated by Django 4.2.2 on 2023-08-11 13:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0017_alter_conflictresolution_tag_instance_destination"),
    ]

    operations = [
        migrations.AddField(
            model_name="vranuser",
            name="tag_definitions",
            field=models.JSONField(default=list),
        ),
    ]
