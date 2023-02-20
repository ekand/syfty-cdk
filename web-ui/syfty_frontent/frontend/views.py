from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render, redirect
from .models import Search
from django.urls import reverse
from django.http import Http404


def index(request):
    if not request.user.is_authenticated:
        return redirect('login')
    current_user = request.user
    latest_search_list = Search.objects.filter(
        owner=current_user).order_by('-id')[:5]
    context = {
        'latest_search_list': latest_search_list,
    }
    return render(request, 'frontend/index.html', context)


def results(request, search_id):
    response = "You're looking at the results of question %s."
    return HttpResponse(response % search_id)


def detail(request, search_id):
    return HttpResponse("You're looking at search %s." % search_id)


def detail(request, search_id):
    try:
        search = Search.objects.get(pk=search_id)
    except Search.DoesNotExist:
        raise Http404("Question does not exist")
    return render(request, 'frontend/detail.html', {'search': search})


def detail(request, search_id):
    search = get_object_or_404(Search, pk=search_id)
    return render(request, 'frontend/detail.html', {'search': search})


def update(request, search_id):
    search = get_object_or_404(Search, pk=search_id)
    search.subreddit = request.POST['subreddit']
    search.search_term = request.POST['search_term']
    search.save()

    return HttpResponseRedirect(reverse('frontend:detail', args=(search.id,)))
