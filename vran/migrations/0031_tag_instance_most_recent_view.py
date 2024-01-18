# Generated by Django 4.2.8 on 2024-01-03 16:33

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vran", "0030_taginstancehistory"),
    ]

    operations = [
        migrations.RunSQL(
            """
            create view "vran_taginstance" as (
                select id
                    , id_persistent
                    , id_entity_persistent
                    , id_tag_definition_persistent
                    , value
                    , time_edit
                    , previous_version_id
                from (
                        select max("id") max_id
                        from vran_taginstancehistory vt
                        group by id_persistent
                    ) with_version
                    left join  (
                        select *
                        from vran_taginstancehistory vt1
                    ) without_version
                    on "with_version"."max_id"="without_version"."id"
            )""",
            reverse_sql="drop view vran_taginstance",
        ),
        migrations.CreateModel(
            name="TagInstance",
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
                ("id_persistent", models.TextField()),
                ("id_entity_persistent", models.CharField(max_length=36)),
                ("id_tag_definition_persistent", models.TextField()),
                ("value", models.TextField(blank=True, null=True)),
                ("time_edit", models.DateTimeField()),
            ],
            options={
                "managed": False,
            },
        ),
    ]
