IP_ADDR=127.0.0.1:8000
# IP_ADDR=192.168.1.237:8000

lock:
	pipenv lock

install: lock
	pipenv install

requirements: install
	pipenv requirements > requirements.txt

shell: requirements
	@ pipenv shell

dev:
	@ cd django; \
	pipenv run reloadium run manage.py runserver $(IP_ADDR) --noreload

dev-nix:
	@ nix-shell --run "\
	cd django; \
	pipenv run reloadium run manage.py runserver $(IP_ADDR) --noreload; \
	"

scss:
	@ cd django; \
	pipenv run ./manage.py sass bootstrap/scss/style.scss static/css/style.css --watch -t compressed;

scss-nix:
	@ nix-shell --run "\
	cd django; \
	pipenv run ./manage.py sass bootstrap/scss/style.scss static/css/style.css --watch -t compressed; \
	"

migrate:
	@ cd django; \
	./manage.py migrate

.PHONY: lock install requirements shell dev dev-nix scss scss-nix migrate
