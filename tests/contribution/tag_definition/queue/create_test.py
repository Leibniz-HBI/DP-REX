# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,disable=unused-argument
from unittest.mock import MagicMock, patch

import pytest

from vran.contribution.models_django import ContributionCandidate
from vran.contribution.tag_definition.models_django import TagDefinitionContribution
from vran.contribution.tag_definition.queue.create import read_csv_head


def test_deletes_existing_tag_definition(contribution_tag_def):
    conf_mock = MagicMock
    conf_mock.CONTRIBUTION_DIRECTORY = "tests/files/"
    with patch("vran.contribution.tag_definition.queue.util.settings", conf_mock):
        read_csv_head(contribution_tag_def.contribution_candidate.id_persistent)
    with pytest.raises(
        TagDefinitionContribution.DoesNotExist  # pylint: disable=no-member
    ):
        TagDefinitionContribution.objects.get(  # pylint: disable=no-member
            id_persistent=contribution_tag_def.id_persistent
        )


def test_extracts_without_header(contribution_user):
    conf_mock = MagicMock
    conf_mock.CONTRIBUTION_DIRECTORY = "tests/files/"
    with patch("vran.contribution.tag_definition.queue.util.settings", conf_mock):
        read_csv_head(contribution_user.id_persistent)
    tag_defs = TagDefinitionContribution.objects.all()  # pylint: disable=no-member
    for idx, tag_def in enumerate(tag_defs):
        assert tag_def.name == str(idx)


_expected_tag_defs = [
    "id",
    "Kategorie",
    "Name",
    "Partei",
    "Wahlkreis",
    "Geschlecht",
    "Kommentar",
    "Bild",
    "tags",
    "Wikipedia_URL",
    "Homepage_URL",
    "SM_Twitter_user",
    "SM_Twitter_id",
    "SM_Twitter_verifiziert",
    "SM_Facebook_id",
    "SM_Facebook_user",
    "SM_Facebook_verifiziert",
    "SM_Youtube_user",
    "SM_Youtube_id",
    "SM_Youtube_verifiziert",
    "SM_Instagram_user",
    "SM_Instagram_id",
    "SM_Instagram_verifiziert",
    "SM_Telegram_user",
    "SM_Telegram_id",
    "SM_Telegram_verifiziert",
    "created_at",
    "created_by",
    "modified_at",
    "modified_by",
]


def test_extracts_with_header(contribution_other):
    conf_mock = MagicMock
    conf_mock.CONTRIBUTION_DIRECTORY = "tests/files/"
    with patch("vran.contribution.tag_definition.queue.util.settings", conf_mock):
        read_csv_head(contribution_other.id_persistent)
    tag_defs = TagDefinitionContribution.objects.all()  # pylint: disable=no-member
    for idx, tag_def in enumerate(tag_defs):
        assert tag_def.name == _expected_tag_defs[idx]
    contribution_candidate = (
        ContributionCandidate.objects.get(  # pylint: disable=no-member
            id_persistent=contribution_other.id_persistent
        )
    )
    assert contribution_candidate.state == ContributionCandidate.COLUMNS_EXTRACTED
