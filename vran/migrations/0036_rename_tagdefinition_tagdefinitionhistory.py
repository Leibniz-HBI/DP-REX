# Generated by Django 4.2.8 on 2024-02-14 08:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0035_alter_tagdefinitioncontribution_discard"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="TagDefinition",
            new_name="TagDefinitionHistory",
        ),
    ]