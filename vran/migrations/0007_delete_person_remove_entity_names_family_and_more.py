# Generated by Django 4.2 on 2023-06-20 13:15

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vran", "0006_tagdefinition_curated_tagdefinition_owner_and_more"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Person",
        ),
        migrations.RemoveField(
            model_name="entity",
            name="names_family",
        ),
        migrations.RemoveField(
            model_name="entity",
            name="names_personal",
        ),
        migrations.AddField(
            model_name="entity",
            name="contribution_candidate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="vran.contributioncandidate",
            ),
        ),
        migrations.AlterField(
            model_name="contributioncandidate",
            name="state",
            field=models.CharField(
                choices=[
                    ("UPLD", "uploaded"),
                    ("CLXT", "columns extracted"),
                    ("CLAS", "columns assigned"),
                    ("VLXT", "values extracted"),
                    ("NTMT", "entities matched"),
                    ("NTAS", "entities assigned"),
                    ("VLAS", "values assigned"),
                    ("MRGD", "merged"),
                ],
                max_length=4,
            ),
        ),
        migrations.AlterField(
            model_name="mergerequest",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="assigned_merge_requests",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="mergerequest",
            name="contribution_candidate",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="vran.contributioncandidate",
            ),
        ),
    ]
