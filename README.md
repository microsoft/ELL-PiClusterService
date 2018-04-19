# Introduction 
Welcome to PiManager.  This is a simple Node.js web application that runs in Azure providing
a simple way to manage a list of raspberry pi machines that are being used for testing.
This service only provides a central place for the machines to register themselves and for
remote jobs to "lock" and "unlock" those machines to coordinate the usage of them.

## Installation
See [Node.js App Service Getting Started](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-get-started-nodejs).

## Build and Test
Develop locally using VS Code then deploy by simply checking in the updates and then pushing to azure using:

```
git push azure master
```

This assumes you already setup your remote to azure using this:
```
git remote add azure https://elladmin@ellpimanager.scm.azurewebsites.net/EllPiManager.git
```


## Adding a Raspberry Pi

To add a Raspberry Pi to the service simply edit the `/etc/rc.local` file and add the following before the bottom exit:
```shell
/home/pi/monitor.sh&
```
Don't forget the ampersand.  

Then run the following from the /home/pi folder:
```shell
curl -o monitor.sh -4 http://clovett14/MiscTools/pidatacenter/monitor.sh
curl -o picluster.py -4 http://clovett14/MiscTools/pidatacenter/picluster.py
curl -o monitor.py -4 http://clovett14/MiscTools/pidatacenter/monitor.py
chmod +x monitor.sh
```

Or copy these files from MiscTools/PiDataCenter folder.
Now when you reboot your pi it will automatically connect to the service and you should see the machine listed there.

## Using the Service

The easiest way to use the service is to use `ELL/tools/utilities/pitest/drivetest.py` which is already setup to use this service.

You can also use the service manually by running these two scripts:
* `lock.py ipaddress` to lock a machine listed as free on the website.
* `unlock.py ipaddress` to unlock the machine when you are finished.

This is handy if you want to login using SSH and do long running work on a given machine, perhaps you need to install some new stuff and so on.

But if you want to automate a short job you can import `picluster.py` into your app and do the following:

```python
import picluster
cluster = picluster.PiBoardTable("http://pidatacenter.cloudapp.net/api/values")
machine = self.cluster.wait_for_free_machine("some descriptive job name")
```
This will wait until a machine becomes available, lock it for your job, then you can do what drivetest does to send the job to the machine using SCP and SSH libraries.  When the job is finished run this:

```python
cluster.unlock(machine.ip_address)
```

This is picking up your user name as well and it ensures you are the only one that can free this machine that you locked.
It is convenient to see who has locked the machine anyway, in case we need to follow up with that person to see if they are done
in the event that something goes wrong and they accidentally forgot to free the machine.

# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.