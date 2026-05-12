# Palantir

Dashboard para visualizar versão do cluster EKS, fim do suporte, addons instalados e compatibilidade com a próxima versão do Kubernetes.

---

## Instalação no EKS

### 1. Permissões AWS

O backend precisa de uma IAM role com permissão para consultar o EKS. Escolha uma das opções:

**Opção A — IRSA (recomendado)**

Crie a policy e a role antes de instalar:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME=<nome-do-seu-cluster>
REGION=<sua-region>

# Cria a policy
aws iam create-policy \
  --policy-name palantir-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListNodegroups",
        "eks:DescribeNodegroup"
      ],
      "Resource": "*"
    }]
  }'

# Cria a role com trust policy para o OIDC do cluster
OIDC=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION \
  --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

aws iam create-role \
  --role-name palantir-role \
  --assume-role-policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Principal\": {
        \"Federated\": \"arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC}\"
      },
      \"Action\": \"sts:AssumeRoleWithWebIdentity\",
      \"Condition\": {
        \"StringEquals\": {
          \"${OIDC}:sub\": \"system:serviceaccount:palantir:palantir\"
        }
      }
    }]
  }"

# Anexa a policy à role
aws iam attach-role-policy \
  --role-name palantir-role \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/palantir-policy
```

**Opção B — Instance profile do node**

Se os nodes já tiverem uma role com permissão `eks:DescribeCluster`, `eks:ListNodegroups` e `eks:DescribeNodegroup`, pule esta etapa — o backend vai usar as credenciais do node automaticamente.

---

### 2. Instalar

```bash
kubectl apply -f https://raw.githubusercontent.com/viniz92/palantir/main/install.yaml
```

Se usou IRSA, anote a ServiceAccount com a role criada:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

kubectl annotate serviceaccount palantir -n palantir \
  eks.amazonaws.com/role-arn=arn:aws:iam::${ACCOUNT_ID}:role/palantir-role

kubectl rollout restart deployment/palantir -n palantir
```

---

### 3. Verificar

Aguarde o pod ficar pronto:

```bash
kubectl rollout status deployment/palantir -n palantir
```

Confirme que o backend conectou ao cluster sem erros:

```bash
kubectl logs -n palantir -l app=palantir -c backend
```

Saída esperada:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Se aparecer erro de permissão AWS, verifique a role/policy do passo 1.

---

### 4. Acessar

```bash
kubectl port-forward -n palantir svc/palantir 8080:80
```

Abra http://localhost:8080 no browser.

---

## Desinstalar

```bash
kubectl delete -f https://raw.githubusercontent.com/viniz92/palantir/main/install.yaml
```

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
