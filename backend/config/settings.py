from pathlib import Path
import dj_database_url
import os
import cloudinary


BASE_DIR = Path(__file__).resolve().parent.parent

# ================================================================
# SEGURIDAD
# ================================================================
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key')

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    "api.centromotos.com.ar", #el viejo:"api.brixsoft.com"
    "localhost",
    "127.0.0.1",
    "138.36.237.49"
]

# ================================================================
# APPS
# ================================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'django_filters',
    'corsheaders',

    # Local
    'gestion',
]

# ================================================================
# MIDDLEWARE
# ================================================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 👈 IMPORTANTE
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# ================================================================
# TEMPLATES
# ================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ================================================================
# BASE DE DATOS (Render / PostgreSQL)
# ================================================================
DATABASES = {
    'default': dj_database_url.config(default='sqlite:///db.sqlite3')
}

# ================================================================
# PASSWORDS
# ================================================================
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ================================================================
# INTERNACIONALIZACIÓN
# ================================================================
LANGUAGE_CODE = 'es-ar'

TIME_ZONE = 'America/Argentina/Buenos_Aires'

USE_I18N = True
USE_TZ = True

# ================================================================
# STATIC FILES
# ================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ================================================================
# MEDIA FILES
# ================================================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ================================================================
# DEFAULT FIELD
# ================================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ================================================================
# DJANGO REST
# ================================================================
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
}

# ================================================================
# CORS (IMPORTANTE PARA FRONTEND)
# ================================================================
CORS_ALLOWED_ORIGINS = [
    "https://www.centromotos.com.ar",
    "https://centromotos.com.ar",
    "https://estadisticas-cm.vercel.app/" #agregado 1/6/26 de estadisticas

    "http://localhost:3000", #desp comentar esto una vez termine y pase a produccion 
    "http://127.0.0.1:3000", #esto tamb
]

CSRF_TRUSTED_ORIGINS = [
    "https://www.centromotos.com.ar",
    "https://centromotos.com.ar",
    "https://centro-motos-web2.vercel.app",
    "https://centro-motos-web2-hugos-projects-eb634449.vercel.app",
    "https://api.centromotos.com.ar",

    "http://localhost:3000", #coemntar esto taamb  una vez 
    "http://127.0.0.1:3000", #y esto tambine 

]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Permitir preflight requests
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUD_NAME'),
    'API_KEY': os.environ.get('API_KEY'),
    'API_SECRET': os.environ.get('API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'