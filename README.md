# Palantir

Dashboard para visualizar versão do cluster EKS, fim do suporte, addons instalados e compatibilidade com a próxima versão do Kubernetes.

## Instalar no cluster

```bash
kubectl apply -f https://raw.githubusercontent.com/viniz92/palantir/main/install.yaml
```

Aguarde o pod ficar pronto:

```bash
kubectl rollout status deployment/palantir -n palantir
```

Acesse o dashboard:

```bash
kubectl port-forward -n palantir svc/palantir 8080:80
```

Abra http://localhost:8080 no browser.

---

## Permissões AWS (IRSA)

O backend usa boto3 para consultar o EKS via API. Por padrão, usa a instance profile do node.

Para IRSA (recomendado), anote a ServiceAccount após instalar:

```bash
kubectl annotate serviceaccount palantir -n palantir \
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT_ID:role/palantir-role
kubectl rollout restart deployment/palantir -n palantir
```

A role precisa de permissão `eks:DescribeCluster`, `eks:ListNodegroups`, `eks:DescribeNodegroup` e `ec2:DescribeInstances`.

---

## Uso local (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
# acesse http://localhost:5173
# faça upload do kubeconfig pela interface
```

---

## Estrutura

```
palantir/
├── install.yaml              # instala tudo no cluster com um comando
├── .github/workflows/        # build e push automático para GHCR
├── backend/                  # FastAPI + kubernetes SDK + boto3
│   └── app/
│       ├── routers/          # cluster, addons, access
│       ├── services/         # k8s.py, eks.py, compatibility.py
│       └── models/
└── frontend/                 # React + Vite + Nginx
    └── src/
        ├── components/
        ├── hooks/
        └── api/
```
