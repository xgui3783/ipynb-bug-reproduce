const { Seafile } = require('hbp-seafile')
const { Readable } = require('stream')
const open = require('open')

const token = process.env.ACCESS_TOKEN || 'ey...'

const DIR = `/bla-${Date.now().toString()}-jupyterhub-bug-repro/`

const HBP_COLLAB_HOST = process.env.HBP_COLLAB_HOST || `https://lab.ebrains.eu`
const HBP_COLLAB_PATH = process.env.HBP_COLLAB_PATH || '/hub/user-redirect/lab/tree/drive/My%20Libraries/My%20Library'

const handle = new Seafile({ accessToken: token })

const main = async () => {
  await handle.init()
  await handle.mkdir({ dir: DIR })

  const s = await handle.ls({ dir: DIR })
  console.log('check dir clean', { s })
  const filename = 'test.ipynb'
  const dataString = `{
    "cells": [
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "!pip install pyjugex"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "from pyjugex import PyjugexAnalysis\\n",
       "import nibabel as nib\\n",
       "import pyjugex\\n",
       "pmap_service_url='$$PMAP_SERVICE_URL$$'"
      ]
     },
     {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
       "roi1_fname = 'roi1.nii.gz'\\n",
       "roi2_fname = 'roi2.nii.gz'"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "hoc1_body = {\\n",
       "  \\"areas\\": $$AREA1$$,\\n",
       "  \\"threshold\\": 0.2\\n",
       "}\\n",
       "with pyjugex.util.get_pmap(url=f'{pmap_service_url}/multimerge_v2', json=hoc1_body) as resp, open(f'./{roi1_fname}', 'wb') as out_file:\\n",
       "    out_file.write(resp.content)"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "hoc2_body = {\\n",
       "  \\"areas\\": $$AREA2$$,\\n",
       "  \\"threshold\\": 0.2\\n",
       "}\\n",
       "with pyjugex.util.get_pmap(url=f'{pmap_service_url}/multimerge_v2', json=hoc2_body) as resp, open(f'./{roi2_fname}', 'wb') as out_file:\\n",
       "    out_file.write(resp.content)"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "hoc1_nii = nib.load(f'./{roi1_fname}')\\n",
       "hoc2_nii = nib.load(f'./{roi2_fname}')\\n",
       "\\n",
       "gene_list=$$GENELIST$$\\n",
       "n_rep = 1000"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "analysis = PyjugexAnalysis(\\n",
       "  n_rep=1000,\\n",
       "  gene_list=gene_list,\\n",
       "  roi1 = hoc1_nii,\\n",
       "  roi2 = hoc2_nii\\n",
       ")"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "analysis.differential_analysis() # Go grab a coffee"
      ]
     },
     {
      "cell_type": "code",
      "metadata": {},
      "outputs": [],
      "source": [
       "print(analysis.anova.result)"
      ]
     }
    ],
    "metadata": {
     "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
     },
     "language_info": {
      "codemirror_mode": {
       "name": "ipython",
       "version": 3
      },
      "file_extension": ".py",
      "mimetype": "text/x-python",
      "name": "python",
      "nbconvert_exporter": "python",
      "pygments_lexer": "ipython3",
      "version": "3.6.7"
     }
    },
    "nbformat": 4,
    "nbformat_minor": 1
   }`


  const rStream = new Readable()
  rStream.path = filename
  rStream.push(dataString)
  rStream.push(null)
  const upload = await handle.uploadFile({ readStream: rStream, filename: filename }, { dir: DIR })
  console.log(upload)
  const sAgain = await handle.ls({ dir: DIR })
  console.log('check dir populated', { sAgain })

  const txt = await handle.readFile({ dir: `${DIR}${filename}` })
  console.log('check file', { txt })

  const url = `${HBP_COLLAB_HOST}${HBP_COLLAB_PATH}${encodeURIComponent(DIR)}${encodeURIComponent(filename)}`
  console.log(url)
  open(url)
}

main()