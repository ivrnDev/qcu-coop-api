"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Image from "next/image";
import classNames from "classnames";
import { zodResolver } from "@hookform/resolvers/zod";

import { Categories, Product } from "@/types/products/products";
import { ProductSchema, ValidateProduct } from "@/middleware/zod/products";
import { getProductById, updateProduct } from "@/lib/api/products";
import { rolePermissions } from "@/lib/permission";
import { createActivity } from "@/lib/api/activity";
import Permission from "../../Permission";
import UpdateVariant from "./updateVariant";
import { ScrollUpButton } from "@radix-ui/react-select";

type Props = {
  categories: Categories[];
  id: string;
};

type SelectedImage = {
  image: File | null;
  albums: File[] | [];
};

type ImageNumber = {
  image: number;
  albums: number;
};

const UpdateProductForm = ({ categories, id }: Props) => {
  const { moderate } = rolePermissions;
  const { toast } = useToast();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [productName, setProductName] = useState<string>("");
  const [adminId, setAdminId] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<SelectedImage>({
    image: null,
    albums: [],
  });
  const [imageNumber, setImageNumber] = useState<ImageNumber>({
    image: 0,
    albums: 0,
  });
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ValidateProduct>({
    resolver: zodResolver(ProductSchema),
  });

  useEffect(() => {
    const getProduct = async () => {
      const item = await getProductById(id);
      setProductName(item[0].product_name);
      handleImage(item[0]);
      if (item && item.length > 0) {
        const defaultFormValues: ValidateProduct = {
          product_name: item[0].product_name || "",
          display_name: item[0].display_name || "",
          display_price: item[0].display_price || "",
          product_description: item[0].product_description || "",
          status: item[0].status == "active" ? "active" : "inactive",
          isFeatured: String(item[0].isFeatured) == "1" ? "1" : "0",
          category_id: String(item[0].category_id) || "",
          display_image: selectedImage.image,
          product_album: selectedImage.albums,
        };
        reset(defaultFormValues);
      }
    };
    getProduct();
  }, []);

  useEffect(() => {
    setValue("display_image", selectedImage.image);
    setValue("product_album", selectedImage.albums);
  }, [selectedImage]);

  const handlePermission = async (permission: boolean, id?: number) => {
    if (permission) {
      setIsAllowed(true);
      id && setAdminId(id);
    }
    !isAllowed && buttonRef.current && buttonRef.current.click();
  };

  const handleImage = (productItem: Product) => {
    let newAlbums: any = [];
    const image = productItem?.display_image;
    if (image) {
      const blob = base64ToBlob(image, "image/png");
      const file = new File([blob], `image.png`, { type: "image/png" });
      setSelectedImage((prevFiles) => ({
        ...prevFiles,
        image: file,
      }));
      setImageNumber((prevCount) => ({
        ...prevCount,
        image: 1,
      }));
    }
    if (productItem.albums && productItem.albums.length > 0) {
      productItem.albums.map((photo) => {
        const blob = base64ToBlob(photo.product_photo, "image/png");
        const file = new File([blob], `image${photo.photo_id}.png`, {
          type: "image/png",
        });
        newAlbums.push(file);
      });
      setSelectedImage((prevFiles) => ({
        ...prevFiles,
        albums: newAlbums,
      }));
      setImageNumber((prevCount) => ({
        ...prevCount,
        albums: productItem.albums.length,
      }));
    }
  };

  const base64ToBlob = (base64: any, type: any) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  const handlePrevNext = (action: number) => {
    if (action === 1) return setCurrentStep(1);
    return setCurrentStep(2);
  };
  const onSubmit = async (data: ValidateProduct) => {
    if (isAllowed) {
      const form = new FormData();
      const { product_album, ...newData } = data;
      for (const key of Object.keys(newData) as (keyof typeof newData)[]) {
        form.append(key, newData[key]);
      }
      if (product_album) {
        for (const file of product_album) {
          form.append("product_album", file);
        }
      }
      try {
        const response = await updateProduct(form, id);
        if (response.status === 200) {
          await createActivity(
            {
              action: "updated",
              target: "product",
              object: data.product_name,
            },
            adminId
          );
          toast({
            description: `You have successfully updated ${data.product_name} product.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Failed to Update Product.",
            description: `${response.data.message}`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Internal Server Error.",
          description: `Something went wrong.`,
        });
      }
    }
  };

  useEffect(() => {
    if (isAllowed) {
      handleSubmit(onSubmit)();
      setIsAllowed(false);
    }
  }, [isAllowed]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative w-full h-full overflow-y-hidden"
    >
      <div className="w-full absolute top-4 left-0">
        <RadioGroup
          defaultValue="product"
          className="flex flex-row-reverse justify-around"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="variation"
              id="variation"
              onClick={() => handlePrevNext(2)}
            />
            <Label htmlFor="variation">Variation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="product"
              id="product"
              onClick={() => handlePrevNext(1)}
            />
            <Label htmlFor="product">Product</Label>
          </div>
        </RadioGroup>
      </div>

      {currentStep === 1 && (
        <>
          <div className="grid grid-cols-2 w-full h-full overflow-y-auto pt-3">
            <div
              id="first-section"
              className="p-5 flex flex-col space-y-5 mt-2"
            >
              <Label className="font-bold">Images / Albums</Label>
              <div id="image-container" className="flex space-x-2">
                <div id="product-image-preview">
                  <Dialog>
                    <DialogTrigger
                      className={classNames({
                        "bg-inputColor border border-black w-24 h-24 cursor-default":
                          true,
                        "cursor-pointer": selectedImage.image,
                      })}
                    >
                      {selectedImage.image && (
                        <div
                          id="preview-image-container"
                          className="relative w-full h-full"
                        >
                          <Image
                            src={URL.createObjectURL(selectedImage.image)}
                            alt="Selected Image"
                            sizes="min-w-1"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </DialogTrigger>
                    {selectedImage.image && (
                      <DialogContent>
                        <AspectRatio ratio={10 / 10} className="absolute">
                          <Image
                            src={URL.createObjectURL(selectedImage.image)}
                            alt="Selected Image"
                            sizes="min-w-1"
                            fill
                            className="rounded-lg object-contain"
                          />
                        </AspectRatio>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
                <div id="product-album-preview">
                  <Dialog>
                    <DialogTrigger
                      className={classNames({
                        "bg-inputColor border border-black w-24 h-24 cursor-default":
                          true,
                        "cursor-pointer": selectedImage.albums.length > 0,
                      })}
                    >
                      {selectedImage.albums[0] && (
                        <div
                          id="preview-image-container"
                          className="relative w-full h-full"
                        >
                          <Image
                            src={URL.createObjectURL(selectedImage.albums[0])}
                            alt="Selected Image"
                            sizes="min-w-1"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </DialogTrigger>
                    {selectedImage.albums.length > 0 && (
                      <DialogContent className="flex justify-center items-center">
                        <div
                          className={classNames({
                            "w-full h-[500px] gap-1 overflow-y-auto flex flex-wrap":
                              true,
                            "grid grid-cols-2":
                              selectedImage.albums.length >= 4,
                          })}
                        >
                          {selectedImage.albums.map((album, index) => (
                            <AspectRatio ratio={1 / 1} key={index} className="">
                              <Image
                                src={URL.createObjectURL(album)}
                                alt="Selected Image"
                                sizes="min-w-1"
                                fill
                                className="rounded-lg object-contain"
                              />
                            </AspectRatio>
                          ))}
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>

                <div className="flex space-x-2">
                  <div className="flex flex-col">
                    <Label
                      htmlFor="display_image"
                      className={classNames({
                        "border-red-600": errors.display_image,
                        "border-black": errors.display_image === undefined,
                        "bg-inputColor border  hover:cursor-pointer w-24 h-24 flex flex-col justify-center items-center":
                          true,
                      })}
                    >
                      <div
                        id="add-icon-container"
                        className="relative w-10 h-10"
                      >
                        <Image
                          src="/icons/add-image-icon.svg"
                          alt="add-image-icon"
                          sizes="min-w-1"
                          fill
                        />
                      </div>
                      <p>{selectedImage.image ? "Edit Image" : "Add Image"}</p>
                      <p>{imageNumber.image}/1</p>
                    </Label>
                    <Controller
                      name="display_image"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => (
                        <>
                          <Input
                            {...field}
                            onChange={(event) => {
                              const selectedFile = event.target.files;
                              if (selectedFile) {
                                const imageFile = selectedFile[0];
                                onChange(imageFile);
                                setSelectedImage((prevFiles) => ({
                                  ...prevFiles,
                                  image: imageFile,
                                }));
                                setImageNumber((prevCount) => ({
                                  ...prevCount,
                                  image: selectedFile.length,
                                }));
                              }
                            }}
                            type="file"
                            id="display_image"
                            className={classNames({
                              "border-red-600": errors.display_image,
                              "border-black":
                                errors.display_image === undefined,
                              hidden: true,
                            })}
                          />
                        </>
                      )}
                    />
                    {errors.display_image && (
                      <p className="text-red-600 text-sm mt-2">
                        <>{errors.display_image?.message}</>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="product_album"
                      className={classNames({
                        "border-red-600": errors.product_album,
                        "border-black": errors.product_album === undefined,
                        "bg-inputColor border hover:cursor-pointer w-24 h-24 flex flex-col justify-center items-center":
                          true,
                      })}
                    >
                      <div
                        id="add-icon-container"
                        className="relative w-10 h-10"
                      >
                        <Image
                          src="/icons/add-image-icon.svg"
                          alt="add-image-icon"
                          sizes="min-w-1"
                          fill
                        />
                      </div>
                      <p>
                        {selectedImage.albums.length > 0
                          ? "Edit Image"
                          : "Add Image"}
                      </p>
                      <p>{imageNumber.albums}/10</p>
                    </Label>
                    <Controller
                      name="product_album"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => (
                        <>
                          <Input
                            {...field}
                            onChange={(event) => {
                              const selectedFile = event.target.files;
                              if (selectedFile) {
                                const albumFiles = Array.from(selectedFile);
                                onChange(albumFiles);
                                setSelectedImage((prevFiles) => ({
                                  ...prevFiles,
                                  albums: albumFiles,
                                }));
                                setImageNumber((prevCount) => ({
                                  ...prevCount,
                                  ["albums"]: selectedFile.length,
                                }));
                              }
                            }}
                            type="file"
                            id="product_album"
                            multiple
                            className={classNames({
                              "border-red-600": errors.product_album,
                              hidden: true,
                            })}
                          />
                        </>
                      )}
                    />
                    {errors.product_album && (
                      <p className="text-red-600 text-sm mt-2">
                        <>{errors.product_album?.message}</>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label htmlFor="product_name" className="font-bold">
                    Name
                  </Label>
                  <Input
                    {...register("product_name")}
                    id="product_name"
                    placeholder="Product Name"
                    autoComplete="off"
                    disabled
                    className={classNames({
                      "border-red-600": errors.product_name,
                      "border-black": errors.product_name === undefined,
                      "bg-inputColor border-black": true,
                    })}
                  />
                </div>
                {errors.product_name && (
                  <p className="text-red-600 text-sm mt-1 text-center">
                    <>{errors.product_name?.message}</>
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label
                    htmlFor="display_name"
                    className="font-bold whitespace-nowrap"
                  >
                    Display Name
                  </Label>
                  <Input
                    {...register("display_name")}
                    id="display_name"
                    placeholder="Display Name"
                    autoComplete="off"
                    className={classNames({
                      "border-red-600": errors.display_name,
                      "border-black": errors.display_name === undefined,
                      "bg-inputColor": true,
                    })}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label
                    htmlFor="display_price"
                    className="font-bold whitespace-nowrap"
                  >
                    Display Price
                  </Label>
                  <Input
                    {...register("display_price")}
                    id="display_price"
                    placeholder="Display Price"
                    autoComplete="off"
                    className={classNames({
                      "border-red-600": errors.display_price,
                      "border-black": errors.display_price === undefined,
                      "bg-inputColor border0black": true,
                    })}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label htmlFor="category_id" className="font-bold">
                    Category
                  </Label>
                  <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger
                            id="category_id"
                            className={classNames({
                              "border-red-600": errors.category_id,
                              "border-black": errors.category_id === undefined,
                              "bg-inputColor border0black w-1/2": true,
                            })}
                          >
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectGroup>
                              {!categories && (
                                <SelectLabel>No Categories</SelectLabel>
                              )}
                              {categories &&
                                categories.length > 0 &&
                                categories.map((category, index) => (
                                  <SelectItem
                                    value={`${String(category.category_id)}`}
                                    key={index}
                                  >
                                    {category.category_name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            <div
              id="second-section"
              className="p-5 flex flex-col space-y-5 mt-6"
            >
              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label htmlFor="status" className="font-bold">
                    Status
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Select onValueChange={onChange} value={value}>
                          <SelectTrigger
                            id="status"
                            className={classNames({
                              "border-red-600": errors.status,
                              "border-black": errors.status === undefined,
                              "bg-inputColor border0black w-1/2": true,
                            })}
                          >
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label htmlFor="isFeatured" className="font-bold">
                    Featured
                  </Label>
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger
                            id="isFeatured"
                            className={classNames({
                              "border-red-600": errors.isFeatured,
                              "border-black": errors.isFeatured === undefined,
                              "bg-inputColor border0black w-1/2": true,
                            })}
                          >
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="1">Yes</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex w-full space-x-5 items-center">
                  <Label htmlFor="product_description" className="font-bold">
                    Description
                  </Label>
                  <Textarea
                    {...register("product_description")}
                    id="product_description"
                    placeholder="Description"
                    autoComplete="off"
                    className={classNames({
                      "border-red-600": errors.product_description,
                      "border-black": errors.product_description === undefined,
                      "bg-inputColor border0black max-h-52 min-h-[10rem]": true,
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          <Dialog>
            <DialogTrigger
              asChild
              className="h-fit absolute right-5 bottom-5 w-[14%] flex space-x-3"
            >
              <Button
                variant="submit"
                ref={buttonRef}
                className="flex space-x-2"
              >
                <div className="relative w-5 h-5">
                  <Image
                    src="/icons/add-sign-icon.svg"
                    alt="add-sign"
                    sizes="min-w-1"
                    fill
                  />
                </div>
                <p className="text-base font-semibold">
                  {isSubmitting ? "Updating Item" : "Update Item"}
                </p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Permission
                roles={moderate}
                handlePermission={handlePermission}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {currentStep === 2 && (
        <div className="grid grid-cols-2 w-full h-full overflow-y-auto pt-10 p-3">
          <UpdateVariant productId={id} productName={productName} />
          <div className="flex flex-col w-fit space-y-4">
            <div className="bg-[#52B788] rounded-e-3xl rounded p-3 text-sm w-28 text-center">
              Maximum
            </div>

            <div className="bg-[#BCE784] rounded-e-3xl rounded w-28 p-3 text-sm  text-center">
              Minimum
            </div>
            <div className="bg-[#EAB61A] rounded-e-3xl rounded w-28 p-3 text-sm  text-center">
              Average
            </div>
            <div className="bg-[#ff831d] rounded-e-3xl rounded w-28 p-3 text-sm  text-center">
              Re-stock  
            </div>
            <div className="bg-[#de1919] text-white rounded-e-3xl rounded w-28 p-3 text-sm  text-center">
              Safety stocks
            </div>
            <div className="bg-black text-white rounded-e-3xl rounded w-28 p-3 text-sm  text-center">
              Out of Stocks
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default UpdateProductForm;
