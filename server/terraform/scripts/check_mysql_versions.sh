#!/bin/bash

# Make sure OCI CLI is installed and configured
echo "Checking available MySQL versions in OCI..."
oci mysql version list --compartment-id ocid1.compartment.oc1..aaaaaaaa74srpwikf4xbuyicglhpxketudog3ioyclo2c2wjzwstjdmmstqq

echo "If the above command fails, make sure OCI CLI is installed and configured."
echo "You can install it with: pip install oci-cli"
echo "Then configure with: oci setup config"