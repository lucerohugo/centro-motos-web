# from rest_framework.permissions import BasePermission
# from django.conf import settings


# class HasAPIKey(BasePermission):
#     def has_permission(self, request, view):

#         # rutas públicas
#         if request.path.startswith('/api/public/'):
#             return True

#         api_key = request.headers.get("Authorization")
#         return api_key == f"Api-Key {settings.API_KEY}"

#a futuro para cuando haya que ponerle seguridad por token a la api asi no ingresa cualquiera