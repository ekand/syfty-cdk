from django.db import models
from django.contrib.auth.models import User


class Search(models.Model):
    subreddit = models.CharField(max_length=200)
    search_term = models.CharField(max_length=200, default="")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.subreddit + "," + self.search_term
