# pylint: disable=too-few-public-methods
"""Exceptions for VrAN"""
from ninja import Schema


class ApiError(Schema):
    "A class for basic HTTP errors."
    msg: "str"


class ValidationException(Exception):
    """Indicates an error during conversion"""


class EntityExistsException(Exception):
    """Indicates that an entity with that ID already exists."""

    def __init__(self, display_txt) -> None:
        self.display_txt = display_txt


class EntityUpdatedException(Exception):
    """Indicates that an entity has been already updated."""

    def __init__(self, id_affected) -> None:
        self.id_affected = id_affected
