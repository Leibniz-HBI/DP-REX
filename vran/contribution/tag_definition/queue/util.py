"Utils for contribution candidate queue methods."
from os.path import join

from django.conf import settings
from pandas import read_csv


def read_csv_of_candidate(contribution, nrows=None):
    "Read the csv file belonging to a contribution candidate"
    pth = join(settings.CONTRIBUTION_DIRECTORY, contribution.file_name)
    if contribution.has_header:
        header_param = 0
    else:
        header_param = None
    data_frame = read_csv(pth, header=header_param, nrows=nrows, dtype="str")
    return data_frame
