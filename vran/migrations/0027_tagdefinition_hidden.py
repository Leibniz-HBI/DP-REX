# Generated by Django 4.2.2 on 2023-11-29 14:13

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vran", "0026_alter_entityconflictresolution_tag_instance_origin_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="tagdefinition",
            name="hidden",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="entity",
            name="disabled",
            field=models.BooleanField(default=False),
        ),
    ]
