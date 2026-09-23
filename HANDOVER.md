# OASIS annotation tool — new user guide

Share this file with new operators. It has **no passwords**.

You need:

1. Access to the **Faculty of Engineering internal network** (campus, VPN, or a jump host such as Tesla).
2. An **Oasis** username and password from the project owner.

---

## Network

Oasis (`oasis.pdn.ac.lk`) sits on the Faculty of Engineering internal network. It is **not** reachable from the public internet.

Get onto that network first, then SSH to Oasis.

| If you are… | Then… |
| --- | --- |
| On the Faculty of Engineering network already (lab, office, campus Wi‑Fi / VPN) | SSH straight to Oasis |
| Outside the faculty network | Use any host that *is* on that network as a jump. One common option is Tesla (`tesla.ce.pdn.ac.lk`) with your faculty/CE account |

Tesla is only an example jump host. Any machine on the faculty internal network works the same way.

```
Your laptop
    →  Faculty of Engineering internal network
    →  oasis.pdn.ac.lk   (project server)
    →  /home/oasisuser   (shared project files)
```

---

## 1. Log in to Oasis

**Already on the internal network:**

```bash
ssh YOUR_OASIS_USER@oasis.pdn.ac.lk
```

**From outside, via a jump host** (Tesla shown as an example):

```bash
ssh YOUR_FACULTY_USER@tesla.ce.pdn.ac.lk
ssh YOUR_OASIS_USER@oasis.pdn.ac.lk
```

You land in `/home/YOUR_OASIS_USER`. Shared project files are under `/home/oasisuser`:

```bash
cd /home/oasisuser
ls
```

| Path | Role |
| --- | --- |
| `Annotation-Tool-Backend/` | Live Node.js API |
| `Annotation-Tool-Frontend_/` | Frontend deploy script |
| `dataset_26_04_2024/` | Image dataset |
| `transfer/` | Copy files in and out |
| `Annotation-Tool-Backend/.env` | Backend env (`MONGODB_URI`, …) |

You cannot read `scripts/` or `.ssh/`.

Optional laptop SSH config (jump host is whatever you use to reach the faculty network):

```sshconfig
Host foe-jump
    HostName tesla.ce.pdn.ac.lk
    User YOUR_FACULTY_USER

Host oasis
    HostName oasis.pdn.ac.lk
    User YOUR_OASIS_USER
    ProxyJump foe-jump
```

Then: `ssh oasis`. If you are already on the internal network, drop `ProxyJump`.

---

## 2. Change environment values

Backend env is `/home/oasisuser/Annotation-Tool-Backend/.env`. It is **not** in git; `git pull` will not overwrite it.

Main key: `MONGODB_URI` (database URL).

The live app uses a **remote** Mongo host on the internal network, not a database on Oasis itself. Do **not** set this to `localhost` or `127.0.0.1` unless the owner has installed a local Mongo again.

```bash
nano /home/oasisuser/Annotation-Tool-Backend/.env
```

Shape only (use the real host the owner gives you):

```bash
MONGODB_URI = 'mongodb://HOST:27017/annotationToolDB'
```

After any backend `.env` change, restart the backend (section 4).

Do not commit `.env` files or paste them into chat or email.

---

## 3. Pull new backend code

The GitHub repo is **public**. No login or SSH key is required.

```bash
cd /home/oasisuser/Annotation-Tool-Backend
git status
git pull
```

Restart the backend after a pull that changes server code.

---

## 4. Restart the backend

The API is PM2 process `annotation-backend`, owned by `oasisuser`. `pm2` as yourself will show an empty list.

```bash
sudo -u oasisuser -H pm2 list
sudo -u oasisuser -H pm2 restart annotation-backend
sudo -u oasisuser -H pm2 logs annotation-backend
```

You do not need the `oasisuser` password for these commands.

---

## 5. Rebuild and deploy the frontend

```bash
sudo /home/oasisuser/Annotation-Tool-Frontend_/deploy.sh
```

---

## 6. Copy files in and out

Do this from a machine **on the faculty internal network** (or from Oasis back to that network).

**Into Oasis:**

```bash
scp -r ./data/ YOUR_OASIS_USER@oasis.pdn.ac.lk:transfer/
scp -r ./images/ YOUR_OASIS_USER@oasis.pdn.ac.lk:/home/oasisuser/dataset_26_04_2024/
```

**Out to a host on the internal network:**

```bash
# on Oasis — YOUR_INTERNAL_HOST is any faculty-network machine (your lab PC, Tesla, …)
scp -r /home/oasisuser/transfer/out/ YOUR_USER@YOUR_INTERNAL_HOST:~/
```

Disk space on Oasis is tight. Stage large dumps in `transfer/`, then move them.

---

## 7. Typical update session

```bash
# 1. Reach the faculty internal network, then:
ssh YOUR_OASIS_USER@oasis.pdn.ac.lk

# 2. Optional: env (Mongo URL, …)
nano /home/oasisuser/Annotation-Tool-Backend/.env

# 3. Backend
cd /home/oasisuser/Annotation-Tool-Backend
git pull
sudo -u oasisuser -H pm2 restart annotation-backend

# 4. Frontend
sudo /home/oasisuser/Annotation-Tool-Frontend_/deploy.sh
```

---

## If something fails

| Problem | What to try |
| --- | --- |
| Cannot reach `oasis.pdn.ac.lk` | You are not on the Faculty of Engineering internal network yet |
| Cannot `cd /home/oasisuser` | Ask the owner to confirm your account is in group `oasisproj` |
| `git pull` fails | Check you are in `Annotation-Tool-Backend` and Oasis has internet |
| `pm2 list` is empty | Use `sudo -u oasisuser -H pm2 list`, not bare `pm2` |
| App cannot reach Mongo | Check `MONGODB_URI`. Do not use localhost |
| `deploy.sh` fails | Need `sudo` as above and outbound internet from Oasis |

Ask the project owner for a new password or a first Oasis account.
